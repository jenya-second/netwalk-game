export function Mask({opacity}: {opacity: number}) {
    return <div style={{
        width: '100%', height: '100%',
        opacity: opacity,
        backgroundColor: '#fff',
        position: 'absolute',
        top: 0,
        left: 0
      }} />
}