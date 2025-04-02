const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const status = err.status || 500

    const message = err.message || "Something went wrong"

    const extraDetails = err.extraDetails || "server error"

    return res.status(status).json({message, extraDetails})
}

export default errorHandler