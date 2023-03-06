import { Link } from "react-router-dom"

export default function NavbarLink(props) {
    return (
        <li className="nav-item">
            <Link style={{ textDecoration: "none" }} to={props.to}>
                <div className="nav-link text-secondary">{"> "}&ensp;{props.title}</div>
            </Link>
        </li>
    )
}