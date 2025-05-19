import { NetwalkGame } from "./NetwalkGame";

export function GamePlot({width = 300, height = 300}: {width: number, height: number}) {
    const multiplier = 50;

    // Convert 639 to 600, 231 to 200, 
    if (width >= multiplier) {
      width -= width % multiplier;
    } else {
      width = multiplier
    }
    if (height >= multiplier) {
      height -= height % multiplier;
    } else {
      height = multiplier;
    }

    const difficulty_level = 1;
    let node_size = 1;

    if (width >= height) {
      node_size = width / (width / multiplier) / difficulty_level;
    } else if (height > width) {
      node_size = height / (height / multiplier) / difficulty_level;
    }

    const rows = Math.floor(height / node_size);
    const columns = Math.floor(width / node_size);

    return <NetwalkGame
            rowsProp={rows}
            columns={columns}
            animate={false}
            animationWait={100}
            randomize={false} />;
}