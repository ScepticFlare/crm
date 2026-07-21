export default function InfoCard({

    title,
    children

}) {

    return (

        <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

                <h5 className="fw-semibold mb-4">

                    {title}

                </h5>

                {children}

            </div>

        </div>

    );

}