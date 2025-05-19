import { createRoot } from 'react-dom/client'


import { App } from './components/App';
import { Logo } from './components/Logo';
import { Subtitle } from './components/Subtitle';
import { HowToPlay } from './components/HowToPlay';
import { GamePlot } from './components/GamePlot';

const plot = {
  width: 150,
  height: 100
}

createRoot(document.getElementById('root')!).render(
  <App>
    <Logo />
    <Subtitle />
    <GamePlot width={plot.width} height={plot.height} />
    <HowToPlay />
  </App>,
)
