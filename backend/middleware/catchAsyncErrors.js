module.exports = (theFunc) => (req, res, next) => {
  Promise.resolve(theFunc(req, res, next)).catch(next);
  //try..................................
};


//created because if required field is nott present in db then it leads to 
//infinty loadinf and db crash.