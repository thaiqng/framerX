import * as React from "react"
import { Frame } from "framer"

export function Hover() {
    return (
        <Frame
            whileHover={{ scale: 0.8 }}
            size={150}
            radius={25}
            background={"#04F"}
            center={true}
        />
    )
}
