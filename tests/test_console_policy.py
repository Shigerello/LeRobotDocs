import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
import yaml
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("policy", ROOT / "aws_console_policy.py")
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)


class ConsolePolicyTest(unittest.TestCase):
    def parse(self, text):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "event.yml"
            path.write_text(text)
            with patch.dict(os.environ, {"LEROBOT_HANDSON_CONFIG": str(path)}):
                return policy.read_policy()

    def test_booleans_and_missing_key(self):
        for value in ["true", "false"]:
            result = self.parse("aws:\n  handson:\n    attendee_console_access: " + value)
            self.assertIs(result["enabled"], value == "true")
            self.assertEqual(result["source"], "event.yml")
            self.assertEqual(len(result["sha256"]), 64)
        self.assertIs(self.parse("aws:\n  handson: {}")['enabled'], True)

    def test_reject_bad_type_namespace_duplicate_and_yaml(self):
        for value in ['"false"', '0', 'null', '[]', '{}']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.parse("aws:\n  handson:\n    attendee_console_access: " + value)
        for text in ['{}', 'handson: {}', 'aws: []', 'aws: {handson: null}',
                     'aws: {handson: {}, attendee_console_access: false}',
                     'aws: {handson: {attendee_console_access: false, attendee_console_access: true}}',
                     'aws: [']:
            with self.subTest(text=text), self.assertRaises((ValueError, yaml.YAMLError)):
                self.parse(text)

    def test_explicit_missing_file_never_falls_back(self):
        with patch.dict(os.environ, {"LEROBOT_HANDSON_CONFIG": "/nonexistent/event.yml"}):
            with self.assertRaises(FileNotFoundError):
                policy.read_policy()

    def test_boolean_environment_override_is_ignored(self):
        with patch.dict(os.environ, {"ATTENDEE_CONSOLE_ACCESS": "true"}):
            self.assertIs(self.parse(
                "aws:\n  handson:\n    attendee_console_access: false"
            )["enabled"], False)

    def test_normal_preview_default(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertIs(policy.read_policy()["enabled"], True)


if __name__ == "__main__":
    unittest.main()
