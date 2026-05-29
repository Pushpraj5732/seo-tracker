import jwt from "jsonwebtoken";

const auth = async (req, res, next) => {
    try {

        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Not authorized, no token"
            });

        }

        const token = header.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.userId = decoded.id;

        next();

    } catch (error) {

        console.error("Middleware Error:", error);

        return res.status(401).json({
            success: false,
            message: "Auth error"
        });

    }
};

export default auth;