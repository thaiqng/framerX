import * as React from "react"
import { Frame, addPropertyControls, ControlType } from "framer"

export function Controls(props) {
    return (
        <Frame
            size={150}
            radius={props.radius}
            background={"#0AF"}
            center={true}
        />
    )
}

Controls.defaultProps = {
    radius: 25,
}

addPropertyControls(Controls, {
    radius: { type: ControlType.Number, title: "Radius" },
})
