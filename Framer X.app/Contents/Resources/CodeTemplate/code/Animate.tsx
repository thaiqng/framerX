import * as React from "react"
import { Frame } from "framer"

export function Animate() {
    return (
        <Frame
            animate={{ rotate: 360 }}
            transition={{ duration: 2 }}
            size={150}
            radius={25}
            background={"#0CF"}
            center={true}
        />
    )
}
