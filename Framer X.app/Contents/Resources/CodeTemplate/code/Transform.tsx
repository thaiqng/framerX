import * as React from "react"
import { useState } from "react"
import { Frame, useMotionValue, useTransform, useAnimation } from "framer"

export function Transform() {
    const x = useMotionValue(0)
    const scale = useTransform(x, [-200, 200], [1.5, 0.5])
    const rotate = useTransform(x, [-200, 200], [-90, 90])

    return (
        <Frame
            drag={"x"}
            dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
            x={x}
            scale={scale}
            rotate={rotate}
            size={150}
            radius={25}
            background={"#80F"}
            center={true}
        />
    )
}
