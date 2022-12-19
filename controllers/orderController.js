const  Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const { nextTick } = require("process");

//Create new order
exports.newOrder = catchAsyncErrors(async(req,res,next)=>{

    const{shippingInfo, orderItems, paymentInfo, itemsPrice, taxPrice, shippingPrice, totalPrice} = req.body;

    const order= await Order.create({
        shippingInfo, 
        orderItems, 
        paymentInfo, 
        itemsPrice, 
        taxPrice, 
        shippingPrice, 
        totalPrice,
        paidAt:Date.now(),
        user:req.user._id,
    });

    res.status(201).json({
        success:true,
        order,
    });
});

//get Single order
exports.getSingleOrder = catchAsyncErrors(async(req,res,next)=>{
    const order = await Order.findById(req.params.id).populate("user","name email");

    if(!order){
        return nextTick(new ErrorHandler("Order not found with this Id",404));
    }

    res.status(200).json({
        success:true,
        order,
    });
});

//get logged in user  order
exports.myOrders = catchAsyncErrors(async(req,res,next)=>{
    const orders = await Order.find({user:req.user._id})

    res.status(200).json({
        success:true,
        orders,
    });
});

//get all orders--admin
exports.getAllOrders = catchAsyncErrors(async(req,res,next)=>{
    const orders = await Order.find();

    let totalAmount = 0;
    orders.forEach(order=>{
        totalAmount+=order.totalPrice;
    })

    res.status(200).json({
        success:true,
        totalAmount,
        orders,
    });
});

//update order status--admin
exports.updateOrder = catchAsyncErrors( async(req,res,next)=>{
    const order = await Order.findById(req.params.id);

    if(!order){
        return nextTick(new ErrorHandler("Order not found with this Id",404));
    }
    
    if(order.orderStatus === "Delivered"){
        return next(new ErrorHandler("We have already delivered this order",400));
    }

    if(order.orderStatus === "Shipped"){
        order.orderItems.forEach(async(o) => {
            await updateStock(o.product, o.quantity);
        });
    }

    order.orderStatus = req.body.status;
    
    if(req.body.status === "Delivered"){
        order.deliveredAt = Date.now();
    }

    await order.save({ validateBeforeSave: false});

    res.status(200).json({
        success:true,
    });
});

async function updateStock(id,quantity){
    const product =await Product.findById(id);
    
    product.Stock -=quantity;

    await product.save({validateBeforeSave: false});

};


//Delete Order--Admin
exports.deleteOrder = catchAsyncErrors(async(req,res,next)=>{
    const order = await Order.findById(req.params.id);

    if(!order){
        return nextTick(new ErrorHandler("Order not found with this Id",404));
    }

  await order.remove();

    res.status(200).json({
        success:true,
    });
});