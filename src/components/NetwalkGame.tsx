import { useEffect, useState, type CSSProperties } from "react";
import { NetwalkUI } from "./NetwalkUI";
import { LevelUp } from "./LevelUp";
import { Mask } from "./Mask";
import { PlayButton } from "./PlayButton";
import { LevelDown } from "./LevelDown";
import _ from "underscore";
import Netwalk, { deepCopyMatrix, type Matrix } from "./Netwalk";

export function NetwalkGame({rowsProp, columns, animate, animationWait, randomize}: {rowsProp: number, columns: number, animate: boolean, animationWait: number, randomize: boolean}) {
    const [matrix, setMatrix] = useState<Matrix>();
    const [gameStarted, setGameStarted] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [rows, setRows] = useState(rowsProp);
    const [netwalk] = useState(new Netwalk());
    
    useEffect(() => {
        generateMatrix({
            rows: rowsProp,
            columns: rowsProp,
            animate: animate,
            animationWait: animationWait,
            randomize: randomize
          });
    }, [])

    let Play,
        Replay,
        mask,
        IncreaseDifficulty,
        DecreaseDifficulty;

    if (!gameStarted && !gameEnded) {
      Play = <PlayButton onPlay={onPlay} title="New Game" />;
    }

    if (!gameStarted && gameEnded) {
      Replay = <PlayButton onPlay={onPlay} title="Play again?" />;
    }

    if (!gameStarted) {
        mask = <Mask opacity={0.6} />
    }
    if (!gameStarted && gameEnded) {
        mask = <Mask opacity={0.4} />
    }

    if (gameStarted && !gameEnded) {
        IncreaseDifficulty = <LevelUp onTrigger={addRow} />

        if (rows > 2) {
        DecreaseDifficulty = <LevelDown onTrigger={removeRow} />
        }
    }

    function rotateNode(id: string) {
        if (!matrix) return;
        let newMatrix = deepCopyMatrix(matrix);
        newMatrix = netwalk.rotateNode(id, newMatrix);
        const gameEnded = netwalk.isMatrixSolved(newMatrix);
        const gameStarted = !gameEnded;
        setMatrix(newMatrix);
        setGameStarted(gameStarted);
        setGameEnded(gameEnded);
    }
    
    function addRow() {
        generateMatrix({
            rows: rows + 1,
            columns: rows + 1,
            animate: false,
            randomize: true
        });
    }
    
    function removeRow() {
        if (rows > 2) {
            generateMatrix({
                rows: rows - 1,
                columns: rows - 1,
                animate: false,
                randomize: true
            });
        }
    }
    
    function onPlay() {
        setGameStarted(true);
        setGameEnded(false);
        generateMatrix({
            rows: rows,
            columns: rows,
            animate: false,
            animationWait: 10,
            randomize: true
        });
    }

    function generateMatrix(options: {
        rows: number;
        columns: number;
        animate: boolean;
        animationWait?: number;
        randomize: boolean;
    }) {

        options = _.extend({
          rows: 3,
          columns: 5,
          animate: false,
          animationWait: 100,
          randomize: true
        }, options);
    
        if (options.animate) {
            // ToDo
    
        } else {
    
            let matrix = netwalk.generateMatrix(options.rows, options.columns);
            if (options.randomize) {
                matrix = netwalk.randomizeMatrix(matrix);
            }
            setRows(options.rows);
            setMatrix(matrix);
        }
    }
    
    return (
        <div style={styles.base}>
            <div style={styles.difficultyContainer}>
                {IncreaseDifficulty}
                {DecreaseDifficulty}
            </div>
            <div style={!gameStarted && !gameEnded ? styles.blur : {}}>
                <NetwalkUI matrix={matrix} onRotate={rotateNode} />
            </div>
            {mask}
            {Play}
            {Replay}
        </div>
    )
}

const styles: {base: CSSProperties, difficultyContainer: CSSProperties, blur: CSSProperties} = {
    base: {
        position: 'relative',
        width: '70vh',
        left: '50%',
        transform: 'translate(-50%,0)'
    },
    difficultyContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        alignItems: 'flex-start'
    },
    blur: {
        filter: 'blur(3px) grayscale(100%)',
        WebkitFilter: 'blur(3px) grayscale(100%)'
    }
}