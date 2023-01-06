export default function (req, res, next) {
  if (res?.data?.status === "error") {
    return res.status(400).json({ message: res.data.message });
  } else {
    next();
  }
}
