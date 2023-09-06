const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");

// Create Product -- Admin
exports.createProduct = catchAsyncErrors( //adding try and catch again n again we have added them once in catchAsyncError function.
  async (req, res, next) => {
  let images = [];

  if (typeof req.body.images === "string") { //string hai mtlb ek hi img hai.
    images.push(req.body.images); //ek hai toh simpli push krdo.
  } else {
    images = req.body.images; //jada hai h toh puri wahi bana do.
    //req.body wali array humri array k barabar krdo.
  }

  const imagesLinks = []; //array jisme sari img k link rahega.

  for (let i = 0; i < images.length; i++) {            //img k index
    const result = await cloudinary.v2.uploader.upload(images[i], {
      folder: "products", //cloudinary k folder.
    });

    imagesLinks.push({ //objects
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;/*phele req.body.images m device k images
                                  tahe ab cloudinary wale aajyege*/
  req.body.user = req.user.id;  //user ki id mil jayegi jisse pta lagega inse chnages kiye h produt m.

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
});

// Get All Product
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 3;
  const productsCount = await Product.countDocuments();

  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();

  let products = await apiFeature.query;

  let filteredProductsCount = products.length;

  apiFeature.pagination(resultPerPage);

  products = await apiFeature.query;

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  });
});

// Get All Product (Admin)
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

// Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product -- Admin

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Images Start Here
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) { //mtlb img m kuch toh hai.
    // Deleting Images From Cloudinary
    for (let i = 0; i < product.images.length; i++) {                   //oldimg ko dlt.
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {   //newimg ko upload.
        folder: "products",
      });

      imagesLinks.push({ //objects.
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    //save krdi new array.
    req.body.images = imagesLinks; /*phele req.body.images m device k images
                                          tahe ab cloudinary wale aajyege*/
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete Product

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Deleting Images From Cloudinary
  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.v2.uploader.destroy(product.images[i].public_id);
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Delete Successfully",
  });
});

// Create New Review or Update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;//destructuring.

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);//jispe review dena hai.

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );// mtlb agar jis id s phele review kr kha h aur jo ab logined id h ..vo same h mtlb tumne phele
  //review de rkha h.

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment); //agar review hai, to ussse change krdia.
    });
  } else {
    product.reviews.push(review);  //agar review in h toh product m add krdia.
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {  //ye total rating h product ki, mtlb sabne n milke kitni de.
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString() //vo sari jo hume dlt ni krni hai.
  );                                                       //req.query.id.toString() ye vo h jo krni h dlt.

  let avg = 0;

  reviews.forEach((rev) => {  //ab review change hora h toh rating ki bhi value change hogi.
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {   //ye teeno chiz update. 
      reviews,
      ratings,
      numOfReviews,
    },
    {     //options
      new: true,
      runValidators: true,        
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
