export function Node({connections, type, onRotate, id, connected}:{connections: string[], type: string, onRotate: (id: string) => void, id: string, connected: boolean}) {

    return <div className={"NetwalkUI-node" + (connected ? '--connected' : '')}
                onClick={onRotate.bind(null, id)}>

             {connections.map((connection, i) => {
               return <div key={i} className={"NetwalkUI-node-" + connection + "link"}></div>;
             })}

            {type === 'computer' ? <div className="NetwalkUI-node-computer"></div> : ''}

            {type === 'server' ? <div className="NetwalkUI-node-server"></div> : ''}

           </div>;
}