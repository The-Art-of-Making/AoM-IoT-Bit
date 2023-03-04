import { useLocation, useNavigate, useParams } from "react-router-dom"

export default function WithRouter(Component) {
    const ComponentWithRouterProp = props => {
        let location = useLocation()
        let navigate = useNavigate()
        let params = useParams()
        return (
            <Component
                {...props}
                router={{ location, navigate, params }}
                navigate={navigate}
                location={location}
                params={params}
            />
        )
    }
    return ComponentWithRouterProp
}