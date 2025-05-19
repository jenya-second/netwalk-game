import type { CSSProperties } from "react"

export function Logo() {
    return <h1 style={styles}>Netwalk</h1>
}

const styles: CSSProperties = {
    color: '#8EC170',
    fontFamily: '"Courier New", "Courier", monospace',
    fontSize: '45px',
    fontWeight: 100,
    margin: '1em 0 0',
    textAlign: 'center',
}