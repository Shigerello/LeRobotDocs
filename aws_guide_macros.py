"""Build-time guide composition; browser value tokens stay literal."""
import posixpath
from aws_console_policy import define_policy, on_pre_page_macros


def define_env(env):
    define_policy(env)
    audience = env.conf.get("extra", {}).get("audience")
    if audience not in {"attendee", "staff"}:
        raise ValueError("extra.audience must be attendee or staff")

    @env.macro
    def guide_link(target):
        """Resolve shared partial links against the page that includes them."""
        source = env.variables["page"].file.src_uri
        path, separator, anchor = target.partition("#")
        relative = posixpath.relpath(path, posixpath.dirname(source) or ".")
        return relative + (separator + anchor if separator else "")

    @env.filter
    def staff_headings(text):
        lines = []
        fence = None
        for line in text.splitlines():
            stripped = line.lstrip()
            if stripped.startswith(("```", "~~~")):
                marker = stripped[:3]
                fence = None if fence == marker else marker if fence is None else fence
            if fence is None and line.startswith("#"):
                line = "#" + line
            lines.append(line)
        return "\n".join(lines)
