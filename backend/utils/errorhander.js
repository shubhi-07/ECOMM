class ErrorHandler extends Error{
    //this file is created : if any error error occur we dont have to throw long msg by writing 
                                          //this file will be called.
    constructor(message,statusCode){
        super(message);    //super is constructor of class error.
        this.statusCode = statusCode

        Error.captureStackTrace(this,this.constructor);   //this means itself
 
    }
    
}

module.exports = ErrorHandler
