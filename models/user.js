const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    resetToken: String,
    resetTokenExpiration: Date,

    cart: {
        items: [{productId: {type: Schema.Types.ObjectId, ref: 'Product', required: true}, quantity: {type: Number, required: true}}]
    }
    
});

userSchema.methods.addToCart = function(product) {
    cartProductIndex = this.cart.items.findIndex(cp => cp.productId.toString() === product._id.toString());
    const updatedCartItems = [...this.cart.items];

    if(cartProductIndex >= 0) {
        updatedCartItems[cartProductIndex].quantity = this.cart.items[cartProductIndex].quantity + 1;
    } else {
        updatedCartItems.push({productId: product._id, quantity: 1});
    }   

    this.cart.items = updatedCartItems;
    return this.save();
}


userSchema.methods.removeFromCart = function(productId) {
    const updatedCartItems = this.cart.items.filter(p => p.productId.toString() !== productId.toString());
    this.cart.items = updatedCartItems;
    return this.save();
}


userSchema.methods.clearCart = function() {
    this.cart = {items: []};
    return this.save();
}

module.exports = mongoose.model('User', userSchema);









//     addToCart(product) {
//         const cartProductIndex = this.cart.items.findIndex(cp => cp.productId.toString() === product._id.toString());
//         let newQuantity = 1;

//         const updatedCartItems = [...this.cart.items];

//         if (cartProductIndex >= 0) {
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         } else {
//             updatedCartItems.push({ productId: new ObjectId(product._id), quantity: newQuantity });
//         }

//         const updatedCart = { items: updatedCartItems };

//         const db = getDb();
//         return db.collection('users').updateOne(
//             { _id: new ObjectId(this._id) },
//             { $set: { cart: updatedCart } }
//         );
//     }













// const mongodb = require('mongodb');

// const ObjectId = mongodb.ObjectId;

// module.exports = class User {
//     constructor(username, email, cart, userId) {
//         this.name = username;
//         this.email = email;
//         this.cart = cart;
//         this._id = userId;
//     }


//     save() {
//         const db = getDb();
//         return db.collection('users').insertOne(this);
//     }




//     getCart() {
//         const db = getDb();
//         const productIds = this.cart.items.map(i => { return i.productId });
//         return db.collection('products')
//             .find({ _id: { $in: productIds } })
//             .toArray()
//             .then(products => {
//                 return products.map(p => {
//                     return {
//                         ...p, quantity: this.cart.items.find(i => {
//                             return i.productId.toString() === p._id.toString();
//                         }).quantity
//                     }
//                 })
//             })
//     }



//     deleteFromCart(productId) {
//         const updatedCartItems = this.cart.items.filter(item => { item.productId.toString() !== productId.toString() });


//         const db = getDb();
//         return db.collection('users').updateOne(
//             { _id: new ObjectId(this._id) },
//             { $set: { cart: { items: updatedCartItems } } }
//         );
//     }



//     addOrder() {
//         const db = getDb();

//         return this.getCart().then(products => {
//             const order = {
//                 items: products,
//                 user: {
//                     _id: new ObjectId(this._id),
//                     name: this.name
//                 }
//             };
//             return db.collection('orders').insertOne(order);
//         })
//             .then(result => {
//                 this.cart = { items: [] };
//                 return db.collection('users')
//                     .updateOne({ _id: new ObjectId(this._id) },
//                         { $set: { cart: { items: [] } } }
//                     );
//             })
//     }


//     getOrders() {
//         const db = getDb();
//         return db.collection('orders').find({'user._id': new ObjectId(this.userId)}).toArray()
//         .then(orders => {
//             console.log(orders);
//             return orders;
//     })
//     .catch(err => console.log(err));
// }



//     static findById(userId) {
//         const db = getDb();
//         return db.collection('users').findOne({ _id: new ObjectId(userId) });
//     }
// }