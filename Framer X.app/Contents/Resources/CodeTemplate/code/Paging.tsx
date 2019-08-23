import * as React from "react"
import { Frame, Page } from "framer"

export function Paging() {
    return (
        <Page width={150} height={150} radius={25} center={true}>
            <Frame size={150} radius={20} background={"#40F"} />
            <Frame size={150} radius={20} background={"#40F"} />
            <Frame size={150} radius={20} background={"#40F"} />
        </Page>
    )
}
