const Product = require('../models/product');
const fileHelper = require('../utils/fileHelper');

exports.getAddProduct = (req, res, next) => {
    message = req.flash()[0];
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing : false,
        errorMessage: message
    })
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;

    if(!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing : false,
            product : {title: title, price: price, description: description},
            errorMessage : 'Attached file is not an image'
        });
    }

    imageUrl =  image.path;
    const product = new Product({title: title, imageUrl: imageUrl, price: price, description: description, userId: req.user._id});
    
    product
    .save() // save() method is provided by mongoose
    .then(result => {
        console.log('Product Created!');
        res.redirect('/admin/products');
    })
    .catch(err => {
        console.log(err);
    });
};

 
exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if(!editMode) return res.redirect('/');

    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        if(!product) return res.redirect('/');

        message = req.flash('error')[0];
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing : editMode,
            product : product,
            errorMessage : message
        })
    })
    .catch(err => {console.log(err)});
}

exports.postEditProduct = (req, res, next) => {
    const id = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedImage = req.file;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;

    Product.findById(id)
    .then(product => {
        product.title = updatedTitle;
        product.description = updatedDescription; 
        if(updatedImage){
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl =  updatedImage.path;
        } 
        product.price = updatedPrice;

        return product.save();
    })
    .then(result => {
        console.log('Product Updated!');
        res.redirect('/admin/products');
    })
    .catch(err => {console.log(err)});

}

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
    .then(product => {
        if(!product) return console.log('Product not found');
        fileHelper.deleteFile(product.imageUrl);
        return Product.findByIdAndRemove(prodId)
    })
    .then(() => {
        console.log('Product Deleted');
        res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
}


exports.getProducts = (req, res, next) => {
    Product.find()
    .then(products => {
        res.render('admin/products', {
            pageTitle: 'Admin Products',
            path: '/admin/products',
            prods: products,
            
        });
    })
    .catch(err => {console.log(err)});
};