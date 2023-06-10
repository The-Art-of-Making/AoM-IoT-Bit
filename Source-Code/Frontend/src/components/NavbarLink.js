import { Link } from "react-router-dom"
import { RouteMapping } from "./RouteMapping"

export default function NavbarLink(props) {
    const page = RouteMapping[props.page]
    return (
        <li className="nav-item">
            <Link style={{ textDecoration: "none" }} to={page.to}>
                <div className="nav-link text-secondary">{"> "}&ensp;{page.title}</div>
            </Link>
        </li>
    )
}