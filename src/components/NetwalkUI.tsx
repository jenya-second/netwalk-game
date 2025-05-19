import type { Matrix } from './Netwalk';
import { Node } from './Node';

export function NetwalkUI({matrix, onRotate}: {matrix: Matrix | undefined, onRotate: (id: string) => void}) {
    return <div className="NetwalkUI">{matrix &&
        matrix.map((row, ind) => {
            return <div className="NetwalkUI-row" key={ind}>{row?.map((node) => {
              return <Node key={`node${node.id}`}
                           id={node.id}
                           type={node.type}
                           connections={node.connections}
                           connected={node.connected}
                           onRotate={onRotate} />;
            })}</div>;
          })
    }</div>;
}
