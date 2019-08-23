import * as React from "react"
import { Frame, Scroll } from "framer"

const items = [0, 1, 2, 3, 4, 5]
const height = 70
const padding = 10

export function Scrolling() {
    return (
        <Scroll radius={25} width={150} height={150} center={true}>
            {items.map(index => {
                return (
                    <Frame
                        key={index}
                        height={height}
                        width={150}
                        radius={15}
                        top={(height + padding) * index}
                        background={"#60F"}
                    />
                )
            })}
        </Scroll>
    )
}
