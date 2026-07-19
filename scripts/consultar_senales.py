#!/usr/bin/env python3
"""Consulta senales desde snapshots diarios de AI Radar."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_DIR = REPO_ROOT / "data" / "daily"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

ESTADO_RANK = {
    "accionable": 0,
    "activa": 1,
    "en-seguimiento": 2,
    "nueva": 3,
    "en-observacion": 4,
}

CONFIANZA_RANK = {
    "alta": 0,
    "media": 1,
    "baja": 2,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Lee un JSON diario de AI Radar y devuelve N senales en JSON."
    )
    parser.add_argument(
        "--dia",
        help="Fecha del snapshot en formato YYYY-MM-DD. Si se omite, usa el ultimo disponible.",
    )
    parser.add_argument(
        "-n",
        "--cantidad",
        type=int,
        default=5,
        help="Cantidad maxima de senales a devolver. Por defecto: 5.",
    )
    parser.add_argument(
        "--orden",
        choices=["original", "id", "titulo", "estado", "confianza", "impacto"],
        default="original",
        help="Campo o criterio para ordenar. Por defecto: original.",
    )
    parser.add_argument(
        "--direccion",
        choices=["asc", "desc"],
        default="asc",
        help="Direccion del orden. Por defecto: asc.",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=DEFAULT_DATA_DIR,
        help="Directorio con snapshots diarios. Por defecto: data/daily.",
    )
    return parser.parse_args()


def fail(message: str, exit_code: int = 1) -> None:
    print(json.dumps({"error": message}, ensure_ascii=False, indent=2), file=sys.stderr)
    raise SystemExit(exit_code)


def available_days(data_dir: Path) -> list[str]:
    if not data_dir.exists():
        return []
    return sorted(path.stem for path in data_dir.glob("*.json") if DATE_RE.match(path.stem))


def resolve_day(data_dir: Path, day: str | None) -> str:
    days = available_days(data_dir)
    if day:
        if not DATE_RE.match(day):
            fail("--dia debe usar formato YYYY-MM-DD.")
        if day not in days:
            suffix = f" Dias disponibles: {', '.join(days)}." if days else ""
            fail(f"No existe snapshot para {day}.{suffix}")
        return day

    if not days:
        fail(f"No hay snapshots diarios en {data_dir}.")
    return days[-1]


def load_snapshot(data_dir: Path, day: str) -> dict[str, Any]:
    path = data_dir / f"{day}.json"
    try:
        with path.open(encoding="utf-8") as handle:
            snapshot = json.load(handle)
    except json.JSONDecodeError as exc:
        fail(f"JSON invalido en {path}: {exc}")

    if not isinstance(snapshot, dict):
        fail(f"El snapshot {path} debe ser un objeto JSON.")
    if not isinstance(snapshot.get("senales"), list):
        fail(f"El snapshot {path} debe contener una lista 'senales'.")
    return snapshot


def order_key(signal: dict[str, Any], order: str, index: int) -> Any:
    if order == "original":
        return index
    if order == "estado":
        return (ESTADO_RANK.get(str(signal.get("estado", "")), 99), index)
    if order == "confianza":
        return (CONFIANZA_RANK.get(str(signal.get("confianza", "")), 99), index)
    return (str(signal.get(order, "")).casefold(), index)


def select_signals(
    signals: list[Any],
    quantity: int,
    order: str,
    direction: str,
) -> list[dict[str, Any]]:
    if quantity < 1:
        fail("--cantidad debe ser mayor o igual a 1.")

    normalized = [signal for signal in signals if isinstance(signal, dict)]
    indexed = list(enumerate(normalized))
    indexed.sort(
        key=lambda item: order_key(item[1], order, item[0]),
        reverse=direction == "desc",
    )
    return [signal for _, signal in indexed[:quantity]]


def main() -> None:
    args = parse_args()
    data_dir = args.data_dir.resolve()
    day = resolve_day(data_dir, args.dia)
    snapshot = load_snapshot(data_dir, day)
    signals = snapshot["senales"]
    selected = select_signals(signals, args.cantidad, args.orden, args.direccion)

    output = {
        "fecha": snapshot.get("fecha", day),
        "contract_version": snapshot.get("contract_version"),
        "orden": args.orden,
        "direccion": args.direccion,
        "cantidad_solicitada": args.cantidad,
        "cantidad_devuelta": len(selected),
        "total_senales": len(signals),
        "senales": selected,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
