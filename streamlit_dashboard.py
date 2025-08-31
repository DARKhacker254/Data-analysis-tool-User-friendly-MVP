# file: data_analysis_tool/data_tool.py
"""Unified Streamlit/CLI plotting tool with tests.

Why: allow execution without `streamlit` installed by providing a CLI fallback.
"""
from __future__ import annotations

# Optional dependency handling
try:
    import streamlit as st  # type: ignore
    _HAS_STREAMLIT = True
except ModuleNotFoundError:  # Why: sandbox or venv may not include streamlit
    st = None  # type: ignore
    _HAS_STREAMLIT = False

import argparse
from io import BytesIO
from pathlib import Path
from typing import List

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


def get_numeric_columns(df: pd.DataFrame) -> List[str]:
    """Return numeric column names. Raises if none found."""
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    if not numeric_cols:
        raise ValueError("No numeric columns found in the dataset.")
    return numeric_cols


def scatter_figure(df: pd.DataFrame, x: str, y: str):
    """Build a seaborn scatterplot figure for given columns."""
    if x not in df.columns or y not in df.columns:
        raise KeyError(f"Columns not in DataFrame: {x=}, {y=}")
    fig, ax = plt.subplots()
    sns.scatterplot(x=x, y=y, data=df, ax=ax)
    ax.set_title(f"Scatter: {x} vs {y}")
    fig.tight_layout()
    return fig


def _read_csv(path: Path) -> pd.DataFrame:
    """Read CSV with sensible defaults."""
    return pd.read_csv(path)


def _sample_df() -> pd.DataFrame:
    """Small in-memory dataset for demo and tests."""
    return pd.DataFrame(
        {
            "x": [1, 2, 3, 4, 5],
            "y": [2, 1, 3, 5, 4],
            "z": [10.0, 11.5, 9.0, 12.0, 10.5],
            "cat": ["a", "a", "b", "b", "a"],
        }
    )


def run_streamlit_app() -> None:
    """Interactive UI when Streamlit is available."""
    assert _HAS_STREAMLIT and st is not None
    st.title("Sample Streamlit Dashboard")
    st.caption(
        "Running in Streamlit mode. Upload a CSV, pick numeric columns, and download the plot."
    )

    uploaded_file = st.file_uploader("Upload a CSV file", type=["csv"])

    if uploaded_file is None:
        st.info("Upload a CSV to proceed. Or try the built-in sample below.")
        if st.button("Use sample data"):
            df = _sample_df()
        else:
            return
    else:
        df = pd.read_csv(uploaded_file)

    st.subheader("Data Preview")
    st.dataframe(df.head(), use_container_width=True)

    try:
        numeric_columns = get_numeric_columns(df)
    except ValueError as e:
        st.warning(str(e))
        return

    col1, col2 = st.columns(2)
    with col1:
        x_axis = st.selectbox("X-axis", options=numeric_columns, index=0)
    with col2:
        y_axis = st.selectbox(
            "Y-axis", options=[c for c in numeric_columns if c != x_axis] or numeric_columns, index=0
        )

    fig = scatter_figure(df, x_axis, y_axis)
    st.pyplot(fig)

    # Download as PNG via in-memory buffer
    buffer = BytesIO()
    fig.savefig(buffer, format="png", dpi=144)
    buffer.seek(0)
    st.download_button(
        label="Download plot as PNG",
        data=buffer,
        file_name=f"scatter_{x_axis}_vs_{y_axis}.png",
        mime="image/png",
    )


def run_cli(input_csv: Path | None, x: str | None, y: str | None, out_path: Path) -> Path:
    """Headless fallback. Reads CSV or uses sample, saves PNG, returns path."""
    if input_csv is None:
        df = _sample_df()
    else:
        if not input_csv.exists():
            raise FileNotFoundError(f"CSV not found: {input_csv}")
        df = _read_csv(input_csv)

    numeric_columns = get_numeric_columns(df)
    if x is None or y is None:
        # Why: pick first two numeric columns to avoid user prompts in CI
        x, y = numeric_columns[:2]

    fig = scatter_figure(df, x, y)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, format="png", dpi=144)
    plt.close(fig)
    return out_path


def _build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="CSV scatter plotter. Streamlit or CLI.")
    p.add_argument("--csv", type=Path, default=None, help="Path to CSV file.")
    p.add_argument("--x", type=str, default=None, help="X column name.")
    p.add_argument("--y", type=str, default=None, help="Y column name.")
    p.add_argument(
        "--out", type=Path, default=Path("plot.png"), help="Output PNG path for CLI mode."
    )
    p.add_argument("--test", action="store_true", help="Run built-in unit tests and exit.")
    return p


# -----------------------------
# Unit tests (stdlib, no extras)
# -----------------------------
import unittest
import tempfile


class TestDataTool(unittest.TestCase):
    def test_numeric_detection(self):
        df = _sample_df()
        cols = get_numeric_columns(df)
        self.assertListEqual(cols, ["x", "y", "z"])  # order preserved by pandas

    def test_scatter_returns_figure(self):
        df = _sample_df()
        fig = scatter_figure(df, "x", "y")
        self.assertEqual(fig.__class__.__name__, "Figure")
        plt.close(fig)

    def test_cli_writes_png(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / "out.png"
            written = run_cli(None, None, None, out)
            self.assertTrue(written.exists())
            self.assertGreater(written.stat().st_size, 0)


def _run_tests_and_exit():
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestDataTool)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    raise SystemExit(0 if result.wasSuccessful() else 1)


def main():
    args = _build_arg_parser().parse_args()

    if args.test:
        _run_tests_and_exit()

    if _HAS_STREAMLIT:
        # When executed via `python data_tool.py`, users may still prefer CLI.
        # Honor CLI flag if provided; otherwise instruct to run with Streamlit.
        if any([args.csv, args.x, args.y]) or args.out != Path("plot.png"):
            out = run_cli(args.csv, args.x, args.y, args.out)
            print(f"Saved: {out}")
        else:
            # Typical Streamlit entrypoint
            run_streamlit_app()
    else:
        print("streamlit not installed; running in CLI mode. To use UI, install with `pip install streamlit`.\n")
        out = run_cli(args.csv, args.x, args.y, args.out)
        print(f"Saved: {out}")


if __name__ == "__main__":
    main()
