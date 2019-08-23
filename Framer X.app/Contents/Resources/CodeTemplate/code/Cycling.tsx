import * as React from "react"
import { Frame, useCycle } from "framer"

export function Cycling() {
    const [twist, cycle] = useCycle(
        { scale: 1, rotate: 0 },
        { scale: 0.8, rotate: 90 }
    )

    return (
        <Frame
            animate={twist}
            onTap={() => cycle()}
            size={150}
            radius={25}
            background={"#08F"}
            center={true}
        />
    )
}
