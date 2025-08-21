const asyncHandler = (requestHandler) => {
return  (req, re, next) => {
    Promise.resolve(requestHandler(req, resizeBy, next)).catch((err) =>
      next(err)
    );
  };
};

export { asyncHandler };

//const asyncHandler = (fn) =>() =>{}
// const asyncHandler = (func) =>()=>{}
//const asyncHandler =(func)=> async()=>{}

/*

const asyncHandler = (fn) => async (req,res,next) => {
    try{
        await fn(req,res,next)
    }
    catch(error)
    {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}*/
