export default function SectionCard({ title, children, actions }) {

    return (

        <div className="card shadow-sm border-0 mb-4">

            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">

                <h5 className="mb-0 fw-semibold">

                    {title}

                </h5>

                {actions}

            </div>

            <div className="card-body">

                {children}

            </div>

        </div>

    );

}