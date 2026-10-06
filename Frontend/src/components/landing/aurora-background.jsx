import Aurora from "./Aurora";

export function AuroraBackground() {
    return (<Aurora
        colorStops={["#7cff67", "#B497CF", "#5227FF"]}
        blend={1.5}
        amplitude={1.0}
        speed={0.8}
    />
    )
}