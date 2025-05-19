export function PlayButton({title, onPlay}: {title: string, onPlay: () => void}) {
    return (
        <div>
          <div style={styles.base}>
            <button style={styles.button} onClick={onPlay}>
              {title}
            </button>
          </div>
        </div>
      )
}

const styles = {
    base: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
  
    button: {
      color: '#8EC170',
      backgroundColor: '#fff',
      border: '2px solid #8EC170',
      fontFamily: '"Helvetica Neue", "Helvetica", "Roboto", "Arial", sans-serif',
      fontSize: '18px',
      fontWeight: '500',
      padding: '10px 10px',
      '@media (minWidth: 640px)': {
        padding: '12px 12px'
      },
      ':hover': {
        cursor: 'pointer',
        border: '2px solid #609D3C',
        color: '#609D3C'
      }
    }
  }