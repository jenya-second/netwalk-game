import type { PropsWithChildren } from "react"

export function App({children}: PropsWithChildren) {
    return (
        <div style={styles}>
            {children}
        </div>
    )
}

const styles = {
    width: '100%',
    margin: 'auto',
    padding: '1em',
    '@media (minWidth: 640px)': {
        width: '640px'
    }
}
