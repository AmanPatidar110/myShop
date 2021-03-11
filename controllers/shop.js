
const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const ITEMS_PER_PAGE = 3;

exports.getIndex = (req, res, next) => {
    let page = +req.query.page || 1;
    let totalItems;

    Product.find().countDocuments().then(numProducts => {
        totalItems = numProducts;
        return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
    })
    .then(products => {
            res.render('shop/index', {
                pageTitle: 'Home',
                path: '/',
                prods: products,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
        })
};


exports.getShop = (req, res, next) => {
    let page = +req.query.page || 1;
    let totalItems;

    Product.find().countDocuments().then(numProducts => {
        totalItems = numProducts;
        return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
    })
    .then(products => {
            res.render('shop/products-list', {
                pageTitle: 'Products',
                path: '/products',
                prods: products,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
        })
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId).then(product => {
        res.render('shop/product-details', {
            product: product,
            pageTitle: product.title,
            path: '/products',

        });
    })
        .catch(err => { console.log(err) });
};


exports.getCart = (req, res, next) => {

    if (!req.session.isLoggedIn) return res.redirect('/login');

    req.user.cart
        .populate('items.productId')
        .execPopulate()
        .then(cart => {
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: cart.items,

            });
        })
        .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    const prodId = req.body.productId;
    Product.findById(prodId).then(product => {
        return req.user.addToCart(product);
    }).then(result => {
        res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));
};


exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders,

            })
        })
        .catch(err => console.log(err));
};

exports.postOrders = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } }
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user._id
                },
                products: products
            });
            order.save();
        })
        .then(result => {
            req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId).then(order => {
        if (!order) {
            return res.redirect('/orders');
        }

        if (order.user.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/orders');
        }

        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join(__dirname, '..', 'invoices', invoiceName);

        const pdfDoc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename = "' + invoiceName + '"');

        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(30).text('#Invoice');
        pdfDoc.fontSize(15).text(`OrderID : ${order._id}`);
        pdfDoc.text('---------------------------------------------------');


        let totalPrice = 0;

        order.products.forEach(p => {
            totalPrice += p.product.price;

            pdfDoc.text(`${p.product.title} - ${p.quantity} x Rs.${p.product.price}`);
        })

        pdfDoc.text('---------------------------------------------------');
        pdfDoc.fontSize(20).text(`Total Price = Rs.${totalPrice}`);

        pdfDoc.end();

    });
}


exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',

    });
};