import SidebarItem from "./SidebarItem"
import { cloudIcon, dashboardIcon, serverIcon, clientIcon, deviceIcon, actionIcon, zoneIcon } from "../icons/icons"

export default function Sidebar(props) {
    return (
        <div className="flex-column flex-shrink-0 p-3 text-white bg-primary flex-grow-1" style={{ maxWidth: "15rem", height: "100vh" }}>
            <div href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                {cloudIcon}
                <span className="px-1 fs-4">AoM IoT</span>
            </div>
            <hr />
            <ul className="nav nav-pills flex-column mb-auto">
                <SidebarItem title="Dashboard" icon={dashboardIcon} currentItem={props.currentItem} link="/dashboard" />
                <SidebarItem title="Server" icon={serverIcon} currentItem={props.currentItem} link="/server" />
                <SidebarItem title="Clients" icon={clientIcon} currentItem={props.currentItem} link="/clients" />
                <SidebarItem title="Devices" icon={deviceIcon} currentItem={props.currentItem} link="/devices" />
                <SidebarItem title="Actions" icon={actionIcon} currentItem={props.currentItem} link="/actions" />
                <SidebarItem title="Zones" icon={zoneIcon} currentItem={props.currentItem} link="/zones" />
            </ul>
        </div>
    )
}