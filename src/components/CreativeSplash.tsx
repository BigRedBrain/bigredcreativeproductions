"use client";

import { useState } from "react";
import { splash } from "@/data/splash";
import Button from "./ui/Button";

export default function CreativeSplash() {
  const [run, setRun] = useState(0);
  const [paused, setPaused] = useState(false);

  function replay() {
    setPaused(false);
    setRun((value) => value + 1);
  }

  return (
    <section className="creative-splash" aria-label={`${splash.name} introduction`}>
      <div className="splash-masthead">
        <span className="splash-wordmark">{splash.wordmark}<span>{splash.wordmarkSubline}</span></span>
        <Button href={splash.enterHref} className="splash-skip">{splash.enterLabel}</Button>
      </div>
      <div className="splash-layout">
        <div className="splash-copy">
          <p className="splash-eyebrow">{splash.eyebrow}</p>
          <h2>{splash.headline}<span>{splash.accent}</span></h2>
          <p className="splash-description">{splash.description}</p>
          <Button href={splash.enterHref} className="splash-enter">{splash.enterLabel}</Button>
          <div className="splash-disciplines" aria-label={splash.disciplinesLabel}>
            {splash.disciplines.map((name) => <span key={name}>{name}</span>)}
          </div>
        </div>
        <div className="splash-stage" key={run} data-paused={paused}>
          <div className="splash-orbit" aria-hidden="true" />
          <div className="splash-art" role="img" aria-label={splash.imageDescription}>
            {[0, 1, 2].map((frame) => (
              <div key={frame} className={`splash-frame splash-frame-${frame}`} style={{ backgroundImage: `url(${splash.image})` }} />
            ))}
          </div>
          <div className="splash-stage-captions" aria-hidden="true">
            {splash.stages.map((text, index) => <span className={`splash-caption-${index}`} key={text}><b>0{index + 1}</b>{text}</span>)}
          </div>
          <div className="splash-progress" aria-hidden="true"><span /></div>
        </div>
      </div>
      <div className="splash-controls">
        <span>{splash.name}</span>
        <div>
          <button type="button" className="splash-motion-control" onClick={() => setPaused((value) => !value)}>{paused ? splash.resumeLabel : splash.pauseLabel}</button>
          <button type="button" className="splash-motion-control" onClick={replay}>{splash.replayLabel}</button>
        </div>
      </div>
    </section>
  );
}
