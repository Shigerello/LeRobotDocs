#!/usr/bin/env python3
"""Export non-secret guide values from issued attendee environment files."""
import argparse
import json
import os
from pathlib import Path
import re
import shlex
import tempfile

ENV_FIELDS = {
    'GCLUE_AI_HANDSON_DEPLOYMENT_ID': 'EVENT_ID',
    'GCLUE_AI_HANDSON_ATTENDEE': 'ATTENDEE_ID',
    'GCLUE_AI_HANDSON_BUCKET': 'BUCKET',
    'GCLUE_AI_HANDSON_REGION': 'REGION',
}
PATTERNS = {
    'EVENT_ID': r'[a-z][a-z0-9-]{1,14}[a-z0-9]',
    'ATTENDEE_ID': r'[a-z][a-z0-9-]{1,30}',
    'BUCKET': r'[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]',
    'REGION': r'[a-z]{2}(?:-[a-z]+)+-\d+',
    'DATASET_REPO_ID': r'[A-Za-z0-9][A-Za-z0-9_./-]{0,191}',
}


def validate(key, value):
    if not isinstance(value, str) or len(value) > 512:
        raise ValueError(f'{key}: invalid value')
    if key == 'DATASET_DIR':
        valid = value.startswith('/') and not re.search(
            r'[\x00-\x1f\x7f]', value
        ) and '://' not in value
    else:
        valid = bool(re.fullmatch(PATTERNS[key], value))
    if not valid or (key == 'ATTENDEE_ID' and value == 'shared'):
        raise ValueError(f'{key}: invalid value')
    return value


def read_values(path):
    """Read allowlisted literal assignments; never source/evaluate the file."""
    values = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        shell = re.fullmatch(
            r'\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)=(.*)', line
        )
        powershell = re.fullmatch(
            r"\s*\$env:([A-Z_][A-Z0-9_]*)\s*=\s*'(.*)'\s*", line
        )
        match = shell or powershell
        if not match or match[1] not in ENV_FIELDS:
            continue
        key = ENV_FIELDS[match[1]]
        if key in values:
            raise ValueError(f'{path.name}: duplicate {key}')
        if powershell:
            value = match[2].replace("''", "'")
        else:
            parts = shlex.split(match[2], comments=True, posix=True)
            if len(parts) != 1:
                raise ValueError(f'{path.name}: non-literal {key}')
            value = parts[0]
        values[key] = validate(key, value)
    missing = sorted(set(ENV_FIELDS.values()) - values.keys())
    if missing:
        raise ValueError(f'{path.name}: missing {", ".join(missing)}')
    return values


def export_settings(directory, dataset_dir=None, dataset_repo_id=None):
    files = sorted(directory.glob('*.env'))
    if not files:
        raise ValueError('No issued .env files found')
    optional = {}
    for key, value in [('DATASET_DIR', dataset_dir),
                       ('DATASET_REPO_ID', dataset_repo_id)]:
        if value is not None:
            optional[key] = validate(key, value)
    records = []
    identities = set()
    cohort = None
    for source in files:
        values = read_values(source)
        identity = values['ATTENDEE_ID']
        if identity in identities:
            raise ValueError('Duplicate attendee ID in input directory')
        identities.add(identity)
        event = tuple(values[key] for key in ['EVENT_ID', 'BUCKET', 'REGION'])
        if cohort is not None and cohort != event:
            raise ValueError('Input files contain different event settings')
        cohort = event
        values.update(optional)
        destination = directory / f'{identity}.guide-settings.json'
        records.append((destination, {
            'format': 'lerobot-aws-guide-settings',
            'version': 1,
            'values': values,
        }))
    # Validate every recipient before writing anything. Atomic file replacement
    # also handles credential renewal without modifying either credential file.
    for destination, data in records:
        fd, temporary = tempfile.mkstemp(dir=directory, prefix='.guide-')
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as stream:
                json.dump(data, stream, ensure_ascii=False, indent=2)
                stream.write('\n')
            os.replace(temporary, destination)
        finally:
            Path(temporary).unlink(missing_ok=True)
    return [destination for destination, _ in records]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--credentials-dir', type=Path, required=True)
    parser.add_argument('--dataset-dir')
    parser.add_argument('--dataset-repo-id')
    args = parser.parse_args()
    try:
        paths = export_settings(
            args.credentials_dir, args.dataset_dir, args.dataset_repo_id
        )
    except (OSError, ValueError):
        # Avoid including credential text in errors, including parser errors.
        parser.exit(1, '設定JSONを生成できませんでした。'
                    '入力ファイルと確定値の形式・重複を確認してください。\n')
    for path in paths:
        print(path)


if __name__ == '__main__':
    main()
