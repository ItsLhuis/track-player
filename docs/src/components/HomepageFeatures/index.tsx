import React from "react"

import clsx from "clsx"

import AudioPlayerSvg from "@site/static/img/undraw_audio_player.svg"
import BuildingBlocksSvg from "@site/static/img/undraw_building_blocks.svg"
import ReactHooksSvg from "@site/static/img/undraw_react_hooks.svg"

type FeatureItem = {
  title: string
  Svg: React.ComponentType<React.ComponentProps<"svg">>
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    title: "Simple Audio Integration",
    Svg: AudioPlayerSvg,
    description: (
      <>
        Integrate powerful audio playback into your applications with a clean, unified API. Our
        modular core allows for extensible, platform-specific implementations.
      </>
    )
  },
  {
    title: "Complete Playback Control",
    Svg: BuildingBlocksSvg,
    description: (
      <>
        Full control of audio playback with queue management, repeat modes, and a comprehensive
        event system, with deep integration into platform-native media controls.
      </>
    )
  },
  {
    title: "React Hooks Ready",
    Svg: ReactHooksSvg,
    description: (
      <>
        A suite of React hooks for tracking playback state, progress, and the active track, making
        UI integration simple and declarative.
      </>
    )
  }
]

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg
          style={{
            margin: "0 2rem",
            height: "180px",
            width: "180px",
            maxWidth: "100%"
          }}
          role="img"
        />
      </div>
      <div className="text--center padding-horiz--md" style={{ marginTop: "1rem" }}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures() {
  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        padding: "2rem 0",
        width: "100%"
      }}
    >
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
