#!/usr/bin/env python3
"""Guarda snapshots de AI Radar usando la API server-side."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENDPOINT = "http://localhost:3000/api/signals/save"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
STATUSES = {"nueva", "activa", "accionable", "en-seguimiento", "en-observacion"}
CONFIDENCES = {"alta", "media", "baja"}


def fail(message: str, exit_code: int = 1) -> None:
    print(json.dumps({"error": message}, ensure_ascii=False, indent=2), file=sys.stderr)
    raise SystemExit(exit_code)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Envia un snapshot de AI Radar a POST /api/signals/save."
    )
    parser.add_argument(
        "snapshot",
        type=Path,
        help="Ruta al snapshot JSON compatible con contracts/ai-radar-signal.schema.json.",
    )
    parser.add_argument(
        "--endpoint",
        default=os.environ.get("AIRADAR_SAVE_ENDPOINT", DEFAULT_ENDPOINT),
        help="Endpoint de guardado. Tambien puede configurarse con AIRADAR_SAVE_ENDPOINT.",
    )
    parser.add_argument(
        "--token-env",
        default=None,
        help=(
            "Variable que contiene el token. Por defecto usa AIRADAR_WRITE_TOKEN "
            "o el token temporal VERCEL_OIDC_TOKEN, en ese orden."
        ),
    )
    return parser.parse_args()


def require_contract() -> None:
    contract = REPO_ROOT / "contracts" / "ai-radar-signal.schema.json"
    if not contract.exists():
        fail(f"No existe el contrato local requerido: {contract}")


def read_snapshot(path: Path) -> dict[str, Any]:
    try:
        with path.open(encoding="utf-8") as handle:
            snapshot = json.load(handle)
    except FileNotFoundError:
        fail(f"No existe el snapshot: {path}")
    except json.JSONDecodeError as exc:
        fail(f"JSON invalido en {path}: {exc}")

    if not isinstance(snapshot, dict):
        fail("El snapshot debe ser un objeto JSON.")
    return snapshot


def validate_snapshot(snapshot: dict[str, Any]) -> None:
    errors: list[str] = []
    if not isinstance(snapshot.get("contract_version"), str):
        errors.append("contract_version debe ser string.")
    if not isinstance(snapshot.get("fecha"), str) or not DATE_RE.match(snapshot["fecha"]):
        errors.append("fecha debe usar formato YYYY-MM-DD.")

    search = snapshot.get("busqueda")
    if not isinstance(search, dict):
        errors.append("busqueda debe ser objeto.")
    else:
        for key in ("consulta", "idioma", "criterio"):
            if not isinstance(search.get(key), str) or not search[key].strip():
                errors.append(f"busqueda.{key} debe ser string no vacio.")

    signals = snapshot.get("senales")
    if not isinstance(signals, list) or not signals:
        errors.append("senales debe ser una lista no vacia.")
    else:
        for index, signal in enumerate(signals):
            if not isinstance(signal, dict):
                errors.append(f"senales[{index}] debe ser objeto.")
                continue
            for key in ("id", "titulo", "evidencia", "impacto", "accion", "estado"):
                if not isinstance(signal.get(key), str) or not signal[key].strip():
                    errors.append(f"senales[{index}].{key} debe ser string no vacio.")
            if signal.get("estado") not in STATUSES:
                errors.append(f"senales[{index}].estado no pertenece al contrato.")
            if "confianza" in signal and signal["confianza"] not in CONFIDENCES:
                errors.append(f"senales[{index}].confianza no pertenece al contrato.")
            source = signal.get("fuente")
            if not isinstance(source, dict):
                errors.append(f"senales[{index}].fuente debe ser objeto.")
                continue
            for key in ("nombre", "url"):
                if not isinstance(source.get(key), str) or not source[key].strip():
                    errors.append(f"senales[{index}].fuente.{key} debe ser string no vacio.")

    if errors:
        fail("Snapshot invalido: " + " ".join(errors))


def post_snapshot(endpoint: str, token: str, snapshot: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(snapshot).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=body,
        method="POST",
        headers={
            "authorization": f"Bearer {token}",
            "content-type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode("utf-8")
        fail(f"API devolvio HTTP {exc.code}: {payload}", exit_code=2)
    except urllib.error.URLError as exc:
        fail(f"No se pudo conectar con la API: {exc.reason}", exit_code=2)

    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        fail(f"La API no devolvio JSON valido: {payload}", exit_code=2)


def main() -> None:
    args = parse_args()
    token_envs = (
        [args.token_env]
        if args.token_env
        else ["AIRADAR_WRITE_TOKEN", "VERCEL_OIDC_TOKEN"]
    )
    token = next((os.environ.get(name) for name in token_envs if os.environ.get(name)), None)
    if not token:
        fail("Falta una variable de autenticacion: " + " o ".join(token_envs))

    require_contract()
    snapshot = read_snapshot(args.snapshot)
    validate_snapshot(snapshot)
    result = post_snapshot(args.endpoint, token, snapshot)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
