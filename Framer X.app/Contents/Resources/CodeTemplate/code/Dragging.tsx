import * as React from "react"
import { Frame } from "framer"

export function Dragging() {
    return (
        <Frame
            drag={true}
            dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
            dragElastic={1}
            size={150}
            radius={25}
            background={"#06F"}
            center={true}
        />
    )
}
