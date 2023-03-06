import { Link } from "react-router-dom"

export default function SidebarItem(props) {
    return (
        <li>
            <Link style={{ textDecoration: "none" }} to={props.link}>
                <div className={"nav-link text-white " + (props.currentItem === props.title ? "bg-secondary" : "")}>
                    {props.icon}
                    <span className="px-2">{props.title}</span>
                </div>
            </Link>
        </li>
    )
}