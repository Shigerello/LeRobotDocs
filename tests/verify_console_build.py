"""Verify rendered HTML, JS and search data for both event policies."""
from pathlib import Path
import argparse
import os
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('config', help='MkDocs config in this checkout')
args = parser.parse_args()
for value in ['true', 'false']:
    with tempfile.TemporaryDirectory() as directory:
        env = dict(os.environ, LEROBOT_HANDSON_CONFIG=str(
            ROOT / f'tests/fixtures/console-{value}.yml'))
        subprocess.run([
            sys.executable, '-m', 'mkdocs', 'build', '--strict',
            '-f', args.config, '-d', directory,
        ], cwd=ROOT, env=env, check=True)
        site = Path(directory)
        pages = list(site.rglob('*.html'))
        assert pages, 'Build produced no HTML'
        content = '\n'.join(path.read_text() for path in pages)
        content += (site / 'search/search_index.json').read_text()
        content += '\n'.join(path.read_text() for path in site.rglob('*.js'))
        if value == 'false':
            assert 'gclue-ai-handson-attendee console-url' not in content
            assert 's3.console.aws.amazon.com' not in content
            assert 'このビルド：受講者のAWSコンソール手順は無効' in content
        if 'attendee' not in args.config:
            assert 'このビルドで有効・無効な手順' in content
            assert 'IAM適用を照会した証明ではありません' in content
        assert '{% if attendee_console_access' not in content
        print(f'{args.config}: {value} passed')
