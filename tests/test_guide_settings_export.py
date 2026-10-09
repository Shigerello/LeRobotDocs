from pathlib import Path
import importlib.util
import json
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    'exporter', ROOT / 'scripts/export_attendee_guide_settings.py'
)
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


def environment(attendee='user01', event='test-2026', powershell=False):
    values = {
        'GCLUE_AI_HANDSON_DEPLOYMENT_ID': event,
        'GCLUE_AI_HANDSON_ATTENDEE': attendee,
        'GCLUE_AI_HANDSON_BUCKET': 'test-workshop-bucket',
        'GCLUE_AI_HANDSON_REGION': 'ap-northeast-1',
        'AWS_SECRET_ACCESS_KEY': 'DO-NOT-EXPORT-SECRET',
        'GCLUE_AI_HANDSON_ATTENDEE_CONSOLE_ACCESS': 'false',
        'GCLUE_AI_HANDSON_CONFIG_DIR': '/private/staff',
    }
    return '\n'.join(
        f"$env:{key} = '{value}'" if powershell
        else f"export {key}='{value}'"
        for key, value in values.items()
    ) + '\n'


class GuideSettingsExportTest(unittest.TestCase):
    def test_batch_both_formats_and_optional_values(self):
        for powershell in [False, True]:
            with self.subTest(powershell=powershell), \
                    tempfile.TemporaryDirectory() as d:
                directory = Path(d)
                for attendee in ['user01', 'user02']:
                    (directory / f'{attendee}.env').write_text(
                        environment(attendee, powershell=powershell)
                    )
                paths = exporter.export_settings(directory)
                self.assertEqual(len(paths), 2)
                for path in paths:
                    data = json.loads(path.read_text())
                    self.assertEqual(data['format'],
                                     'lerobot-aws-guide-settings')
                    self.assertEqual(data['version'], 1)
                    self.assertEqual(set(data['values']),
                                     set(exporter.ENV_FIELDS.values()))
                    self.assertNotIn('DO-NOT-EXPORT', path.read_text())
                    self.assertNotIn('/private/staff', path.read_text())
                paths = exporter.export_settings(
                    directory, '/home/ubuntu/data set', 'workshop/test'
                )
                for path in paths:
                    values = json.loads(path.read_text())['values']
                    self.assertEqual(values['DATASET_DIR'],
                                     '/home/ubuntu/data set')
                    self.assertEqual(values['DATASET_REPO_ID'],
                                     'workshop/test')

    def test_validates_all_before_writing(self):
        with tempfile.TemporaryDirectory() as d:
            directory = Path(d)
            (directory / 'user01.env').write_text(environment())
            (directory / 'user02.env').write_text(
                environment('user02', 'other-event')
            )
            with self.assertRaises(ValueError):
                exporter.export_settings(directory)
            self.assertFalse(list(directory.glob('*.json')))

    def test_never_executes_environment(self):
        with tempfile.TemporaryDirectory() as d:
            directory = Path(d)
            probe = directory / 'must-not-exist'
            (directory / 'user01.env').write_text(
                environment() + f'touch "{probe}"\n'
            )
            exporter.export_settings(directory)
            self.assertFalse(probe.exists())

    def test_missing_duplicate_invalid_optional_and_identity(self):
        for source in ['', environment() +
                       'export GCLUE_AI_HANDSON_ATTENDEE=user02\n',
                       environment('shared')]:
            with tempfile.TemporaryDirectory() as d:
                directory = Path(d)
                (directory / 'invalid.env').write_text(source)
                with self.assertRaises(ValueError):
                    exporter.export_settings(directory)
                self.assertFalse(list(directory.glob('*.json')))
        with tempfile.TemporaryDirectory() as d:
            directory = Path(d)
            (directory / 'user01.env').write_text(environment())
            with self.assertRaises(ValueError):
                exporter.export_settings(directory, 'relative/path')

    def test_download_copy_matches_script(self):
        role = ROOT.name
        self.assertEqual(
            (ROOT / 'scripts/export_attendee_guide_settings.py').read_bytes(),
            (ROOT / f'docs-aws-{role}/assets/downloads/'
             'export_attendee_guide_settings.py').read_bytes()
        )


if __name__ == '__main__':
    unittest.main()
