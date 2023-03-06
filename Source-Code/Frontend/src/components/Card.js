export default function Card(props) {
    return (
        <div className="card text-white bg-primary mb-3" style={{ maxWidth: "20rem" }}>
            <div className="card-header" style={{ fontWeight: "bold" }}>Device</div>
            <div className="card-body bg-primary">
                <div className="bg-dark d-flex justify-content-center py-5 rounded">
                    <p className="m-3">Off</p>
                    <label className="switch align-self-center">
                        <input type="checkbox" />
                        <span className="slider round"></span>
                    </label>
                    <p className="m-3">On</p>
                </div>
            </div>
        </div>
    )
}