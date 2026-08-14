import { Suspense } from "react"
import { Login } from "@/app/components/auth/login"

// `Login` reads the ?next= parameter, so it needs a Suspense boundary to keep
// the route statically renderable.
const page = () => {
    return (
        <Suspense fallback={null}>
            <Login />
        </Suspense>
    )
}

export default page;
