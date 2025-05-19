import type { CSSProperties, PropsWithChildren } from "react";

export function Paragraph({children}: PropsWithChildren) {
    return (
        <p style={styles}>
          {children}
        </p>
    )
}

const styles: CSSProperties = {
    color: '#7B7B7B',
    fontFamily: '"Helvetica Neue", "Helvetica", "Roboto", "Arial", sans-serif',
    fontSize: '16px',
    fontWeight: '200',
    margin: '2em 0',
    lineHeight: '1.5em',
    textAlign: 'center'
}

