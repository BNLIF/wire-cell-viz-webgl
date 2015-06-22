// Author: Chao Zhang (chao@bnl.gov)
// May 15, 2015

var MAX_EVENTS = 6;
var id = 1;
// var cameraType = "perspective";

var routes = {
    '/:eventId': Reload,
    '/:eventId/orthocamera': SetOrthoCamera
}

function Reload(eventId) {
    id = parseInt(eventId);
    // console.log("id changed to " + id);
}

function SetOrthoCamera(eventId) {
    id = parseInt(eventId);
    guiController.orthocamera = true;
    // cameraType = "orthographic";
}

var router = Router(routes);

var gui = new dat.GUI();

var el_slice_x = $("#slice_x");
var el_slice_number = $("#slice_number");

// var rainbow = new Rainbow();
// rainbow.setNumberRange(0, 10000);

var group, container, scene, scene2, camera, renderer, controls;
var animationId;
var ev, ev_truth;
var slice;
// var r = 800;
var halfx = 128.;
var halfy = 116.;
var halfz = 520.;
var eventXmin, eventXmax, eventYmin, eventYmax, eventZmin, eventZmax;
var colorMax = 14000*2;

var depth = 1600;
var default_opacity = 0.3;
var doRotate = false;
// var positions;

var guiController = {
    display: "rec_charge_blob",
    showCharge: true,
    orthocamera: false,

    rec_charge_blob_opacity: default_opacity,
    rec_charge_blob_size: 2,

    rec_charge_cell_opacity: 0.,
    rec_charge_cell_size: 2,

    rec_simple_opacity: 0.,
    rec_simple_size: 2,

    truth_opacity: 0.,
    truth_size: 2,

    slice: {
        sliced_mode: false,
        width: 0.32,
        position: -halfx+0.32/2,
        opacity: 0.1,
        color: 0x00FFFF
    },

    eventNo: id,
    Next: function () {
        var newId = id >= MAX_EVENTS ? 1 : id+1;
        window.location.href = '#/' + newId;
        location.reload();
    },
    Prev: function () {
        var newId = id <= 1 ? MAX_EVENTS : id-1;
        window.location.href = '#/' + newId;
        location.reload();
    },
    NextSlice: function () {
        this.slice.position = this.slice.position + this.slice.width;
        slice.position.x = this.slice.position;
        updateStatusBar();
        if (this.slice.sliced_mode) {
            drawAllSlicedParticles(this.slice.position-this.slice.width/2, this.slice.width);
        }
    },
    PrevSlice: function () {
        this.slice.position = this.slice.position - this.slice.width;
        slice.position.x = this.slice.position;
        updateStatusBar();
        if (this.slice.sliced_mode) {
            drawAllSlicedParticles(this.slice.position-this.slice.width/2, this.slice.width);

        }
    },
    CenterToEvent: function() {
        camera.position.x = -depth;
        camera.position.y = (eventYmin + eventYmax)/2;
        camera.position.z = (eventZmin + eventZmax)/2 - halfz;
        controls.center.set(
            (eventXmin + eventXmax)/2 - halfx,
            (eventYmin + eventYmax)/2,
            (eventZmin + eventZmax)/2 - halfz
        );
        controls.update();
    },
    ResetCamera: function() {
        camera.position.x = -depth;
        camera.position.y = 0;
        camera.position.z = 0;
        controls.center.set(0,0,0);
        controls.update();
    }
}

router.init();
guiController.eventNo = id;

init();
animate();


// The SST class
function SST(id, option) {
    this.id = id;
    this.option = typeof option !== 'undefined' ?  option : 'rec_charge_blob';
    this.url = "data/" + id + "/" + id + "-rec_charge_blob.json";
    this.x = [];
    this.y = [];
    this.z = [];
    this.q = [];
    this.chargeColor = new THREE.Color(0xFFFFFF);
    this.material = new THREE.PointCloudMaterial( {
        // color: guiController.rec_charge_color,
        vertexColors: true,
        size: 2,
        blending: THREE.NormalBlending,
        // blending: THREE.AdditiveBlending,
        // blending: THREE.NoBlending,
        // blending: THREE.MultiplyBlending,
        // blending: THREE.SubtractiveBlending,
        opacity: guiController.rec_charge_blob_opacity,

        transparent: true,
        sizeAttenuation: false
    } );
    // console.log(this.material.blending);
    this.geometry = new THREE.Geometry();
    this.pointCloud = null;

    if (this.option === 'truth') {
        this.url = "data/" + id + "/" + id + "-truth.json";
        this.chargeColor = new THREE.Color(0xFFFF00);
        this.material.opacity = guiController.truth_opacity;
    }
    else if (this.option === 'rec_simple') {
        this.url = "data/" + id + "/" + id + "-rec_simple.json";
        this.chargeColor = new THREE.Color(0xFF00FF);
        this.material.opacity = guiController.rec_simple_opacity;
    }
    else if (this.option === 'rec_charge_cell') {
        this.url = "data/" + id + "/" + id + "-rec_charge_cell.json";
        this.chargeColor = new THREE.Color(0xFF0000);
        this.material.opacity = guiController.rec_charge_cell_opacity;
    }

    this.loadData = function () {
        var sst = this;
        var xhr = $.getJSON(sst.url, function(data) {

            // console.log(data);
            sst.x = data.x;
            sst.y = data.y;
            sst.z = data.z;
            sst.q = data.q;

            var particleCount = data.x.length;
            if (sst.option == "rec_charge_blob") {
                eventXmax = getMaxOfArray(data.x);
                eventXmin = getMinOfArray(data.x);
                eventYmax = getMaxOfArray(data.y);
                eventYmin = getMinOfArray(data.y);
                eventZmax = getMaxOfArray(data.z);
                eventZmin = getMinOfArray(data.z);
            }

            for (var i=0; i<particleCount; i++) {
                var v = new THREE.Vector3(
                    data.x[i] - halfx,
                    data.y[i],
                    data.z[i] - halfz
                );
                sst.geometry.vertices.push(v);
                var color = new THREE.Color();
                color.setHSL(getColorAtScalar(data.q[i], colorMax), 1, 0.5);
                sst.geometry.colors.push(color);
            }


            // create the particle system
            sst.pointCloud = new THREE.PointCloud(sst.geometry, sst.material);
            group.add( sst.pointCloud );

        }).fail(function () {
            console.log("load " + sst.url +  " failed");
        });
        return xhr;
    };
}



function init() {
    initGUI();

    container = document.getElementById( 'container' );
    if (!guiController.orthocamera) {
        camera = new THREE.PerspectiveCamera( 25, window.innerWidth / window.innerHeight, 1, 4000 );

        camera.position.z = depth*Math.cos(Math.PI/4);
        camera.position.x = -depth*Math.sin(Math.PI/4);;
    }
    else {
        camera = new THREE.OrthographicCamera( window.innerWidth/-2, window.innerWidth/2, window.innerHeight/2, window.innerHeight/-2, 1, 4000 );
        camera.position.z = depth*Math.cos(Math.PI/4);
        camera.position.x = -depth*Math.sin(Math.PI/4);;
    }


    // camera.position.y = Math.sin(Math.PI*90/180) * 1000;

    scene = new THREE.Scene();
    scene2 = new THREE.Scene();

    // scene.add(camera);
    // scene2.add(camera);

    group = new THREE.Group();
    scene.add(group);

    var helper = new THREE.BoxHelper( new THREE.Mesh( new THREE.BoxGeometry( halfx*2, halfy*2, halfz*2) ) );
    helper.material.color.setHex( 0x080808 );
    helper.material.blending = THREE.AdditiveBlending;
    helper.material.transparent = true;
    group.add( helper );

    slice = new THREE.Mesh(
        new THREE.BoxGeometry(guiController.slice.width, halfy*2, halfz*2 ),
        new THREE.MeshBasicMaterial( {
            color: guiController.slice.color,
            transparent: true,
            opacity: guiController.slice.opacity,
            blending: THREE.AdditiveBlending
        }));
    slice.position.x = guiController.slice.position;
    scene2.add( slice );  // slice has its own scene

    ev = new SST(id);
    ev.loadData();

    ev_rec_charge_cell = new SST(id, "rec_charge_cell");
    ev_rec_charge_cell.loadData();

    ev_truth = new SST(id, "truth");
    ev_truth.loadData();

    ev_rec_simple = new SST(id, "rec_simple");
    ev_rec_simple.loadData();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth*0.85, window.innerHeight );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    container.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls( camera, renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

    // var ambientLight = new THREE.AmbientLight(0x000044);
    // scene.add(ambientLight);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth*0.85, window.innerHeight );

}

function animate() {

    // var time = Date.now() * 0.001;

    if(doRotate) {
        rotate();
    }
    else {
        stop();
    }
    // group.rotation.y = Date.now() * 0.0003;
    // camera.rotation.y = time * 0.01;

    animationId = requestAnimationFrame(animate);
    renderer.autoClear = false;
    renderer.clear();
    renderer.render( scene, camera );
    renderer.clearDepth();
    renderer.render( scene2, camera );
}

function rotate()
{
    var speed = Date.now() * 0.0003;
    scene.rotation.y = speed;
    // scene2.rotation.y = speed;

    // controls.update();
    // gui.closed = true;
}

function stop()
{
    scene.rotation.y = 0;
    slice.material.opacity = guiController.slice.opacity;
}

// function showCharge(event, drawColor) {
//     var particleCount = event.x.length;
//     for (var i=0; i<particleCount; i++) {
//         if (drawColor) {
//             var color = new THREE.Color();
//             color.setHSL(getColorAtScalar(event.q[i], colorMax), 1, 0.5);
//             event.geometry.colors[i] = color;
//         }
//         else {
//             event.geometry.colors[i] = event.chargeColor;
//         }
//     }
//     event.geometry.colorsNeedUpdate = true;
//     // event.material.needsUpdate = true;
// }

// function showAllCharge(drawColor)
// {
//     showCharge(ev, drawColor);
//     showCharge(ev_truth, drawColor);
//     showCharge(ev_rec_simple, drawColor);
// }

function drawSlicedParticles(event, start, width) {
    var particleCount = event.x.length;

    group.remove(event.pointCloud);

    event.geometry = new THREE.Geometry();

    for (var i=0; i<particleCount; i++) {
        var x = event.x[i] - halfx;
        var y = event.y[i];
        var z = event.z[i] - halfz;
        if (x  < start || x > start+width) {
            continue;
        }
        var v = new THREE.Vector3(
            event.x[i] - halfx,
            event.y[i],
            event.z[i] - halfz
        );
        event.geometry.vertices.push(v);
        // if (event.geometry.vertices.length==10) break;
        var color = new THREE.Color();
        if (guiController.showCharge) {
            color.setHSL(getColorAtScalar(event.q[i], colorMax), 1, 0.5);
        }
        else {
            color = event.chargeColor;
        }
        event.geometry.colors.push(color);
    }

    event.pointCloud = new THREE.PointCloud(event.geometry, event.material);
    group.add(event.pointCloud);


    // for (var i=0; i<particleCount; i++) {
    //     var x = event.x[i] - halfx;
    //     var y = event.y[i];
    //     var z = event.z[i] - halfz;

    //     if (x  < start || x > start+width) {
    //         event.geometry.colors[i] = new THREE.Color(0, 0, 0);
    //     }
    //     else {
    //         if (guiController.showCharge) {
    //             var color = new THREE.Color();
    //             // color.setHex(rainbow.colourAt(data.q[i]/100));
    //             color.setHSL(getColorAtScalar(event.q[i], colorMax),1, 0.5);
    //             event.geometry.colors[i] = color;
    //         }
    //         else {
    //             event.geometry.colors[i] = event.chargeColor;
    //         }
    //     }
    // }



    // event.geometry.colorsNeedUpdate = true;
    // event.material.needsUpdate = true;
    // console.log(event.geometry);
}

function drawAllSlicedParticles(start, width) {
    drawSlicedParticles(ev, start, width);
    drawSlicedParticles(ev_rec_charge_cell, start, width);
    drawSlicedParticles(ev_truth, start, width);
    drawSlicedParticles(ev_rec_simple, start, width);
}

// function restoreParticles(event) {
//     var particleCount = event.x.length;

//     // event.material.vertexColors = guiController.vertexColors;

//     for (var i=0; i<particleCount; i++) {
//         var color = new THREE.Color();
//         // color.setHex(rainbow.colourAt(data.q[i]/100));
//         color.setHSL(
//             getColorAtScalar(event.q[i], colorMax),
//             1, 0.5);
//         event.geometry.colors[i] = color;
//     }
//     event.geometry.colorsNeedUpdate = true;
//     event.material.needsUpdate = true;
//     // console.log(event.geometry);
// }

// function restoreAllParticles() {
//     restoreParticles(ev);
//     restoreParticles(ev_truth);
//     restoreParticles(ev_rec_simple);
// }

function updateStatusBar() {
    el_slice_x.html(slice.position.x.toFixed(1));
    el_slice_number.html(((slice.position.x+halfx)/0.32).toFixed(0));
}

$(document).on("keypress", function( event ) {
    // console.log(  event.which );
    if (event.which == 110 ) { // "n"
        guiController.Next();
        // console.log(guiController.slice.position);
    }
    else if (event.which == 112 ) { // "p"
        guiController.Prev();
    }
    else if (event.which == 107) { // "k"
        guiController.NextSlice();
    }
    else if (event.which == 106) { // "j"
        guiController.PrevSlice();
    }
    else {
        // console.log(event.which);
    }
});

$("#nextEvent").on("click", function(e){
    e.preventDefault();
    guiController.Next();
});
$("#prevEvent").on("click", function(e){
    e.preventDefault();
    guiController.Prev();
});
$("#nextSlice").on("click", function(e){
    e.preventDefault();
    guiController.NextSlice();
});
$("#prevSlice").on("click", function(e){
    e.preventDefault();
    guiController.PrevSlice();
});
// $("#collapse").on("click", function(e){
//     e.preventDefault();
//     el = $(this);
//     if (el.html() === "collapse all") {
//         gui.__folders["Recon (Charge)"].close();
//         gui.__folders["Recon (Simple)"].close();
//         gui.__folders["Truth"].close();
//         gui.__folders["Slice"].close();
//         gui.__folders["Camera"].close();
//         el.html("open all");
//     }
//     else {
//         gui.__folders["Recon (Charge)"].open();
//         gui.__folders["Recon (Simple)"].open();
//         gui.__folders["Truth"].open();
//         gui.__folders["Slice"].open();
//         gui.__folders["Camera"].open();
//         el.html("collapse all");
//     }
// });
$("#hideStatus").on("click", function(e){
    e.preventDefault();
    el = $(this);
    if (el.html() === "hide status bar") {
        $("#statusbar").hide();
        el.html("show status bar")
    }
    else {
        $("#statusbar").show();
        el.html("hide status bar");
    }
});

$("#play").on("click", function(e){
    e.preventDefault();
    el = $(this);
    if (el.html() === "play") {
        cancelAnimationFrame(animationId);
        doRotate = true;
        slice.material.opacity = 0;
        // ev.material.vertexColors = true;
        ev.material.needsUpdate = true;
        // ev_rec_simple.material.vertexColors = true;
        ev_rec_simple.material.needsUpdate = true;
        // ev_truth.material.vertexColors = true;
        ev_truth.material.needsUpdate = true;
        animate();
        // rotate();
        el.html("stop");
        gui.close();
        $("#statusbar").hide();
        if (screenfull.enabled) {
            screenfull.request(document.getElementById('container'));
        }
    }
    else {
        cancelAnimationFrame(animationId);

        doRotate = false;
        animate();

        // stop();
        el.html("play");
        gui.open();
        $("#statusbar").show();
    }

});

function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
  return Math.min.apply(null, numArray);
}

function getColorAtScalar(n, maxLength) {
    var value;
    if (n>maxLength) {
        value = 0;
    }
    else {
        // value = Math.pow((maxLength-n)/maxLength, 3) * 270 / 360;
        value = (maxLength-n)/maxLength * 240 / 360;
    }
    return value;
    // return 220./360;
}

function initGUI() {

    // gui.remember(guiController);
    // gui.remember(guiController.slice);

    gui.add(guiController, "eventNo", 1, MAX_EVENTS)
       .name("Event")
       .step(1)
       .onFinishChange(function(value) {
            window.location.href = '#/' + value;
            location.reload();
        });
    // gui.add(guiController, 'Prev');
    // gui.add(guiController, 'Next');

    gui.add(guiController, 'display', [ 'rec_charge_blob', 'rec_charge_cell', 'rec_simple', 'truth'])
       .name("Display")
       .onChange(function(value) {
            if (value == 'rec_charge_blob') {
                ev.material.opacity = default_opacity;
                ev_rec_charge_cell.opacity = 0;
                ev_rec_simple.material.opacity = 0;
                ev_truth.material.opacity = 0;
            }
            else if (value == 'rec_charge_cell') {
                ev.material.opacity = 0;
                ev_rec_charge_cell.material.opacity = 0.3;
                ev_rec_simple.material.opacity = 0;
                ev_truth.material.opacity = 0;
            }
            else if (value == 'rec_simple') {
                ev.material.opacity = 0;
                ev_rec_charge_cell.material.opacity = 0;
                ev_rec_simple.material.opacity = default_opacity;
                ev_truth.material.opacity = 0;
            }
            else if (value == 'truth') {
                ev.material.opacity = 0;
                ev_rec_charge_cell.material.opacity = 0;
                ev_rec_simple.material.opacity = 0;
                ev_truth.material.opacity = default_opacity;
            };
            ev.material.needsUpdate = true;
            ev_rec_charge_cell.material.needsUpdate = true;
            ev_rec_simple.material.needsUpdate = true;
            ev_truth.material.needsUpdate = true;
       });

   gui.add(guiController, "showCharge")
      .name("Show Charge")
      .onChange(function(value) {

            if(guiController.slice.sliced_mode) {
                drawAllSlicedParticles(guiController.slice.position-guiController.slice.width/2, guiController.slice.width);
            }
            else {
                // showAllCharge(value);
                drawAllSlicedParticles(-halfx, halfx*2);

            }

    });

    var folder_recon = gui.addFolder("Recon (Blob Charge)");
    folder_recon
        .add(guiController, "rec_charge_blob_size", 0, 6)
        .name("size")
        .step(1)
        .onChange(function(value) {
            ev.material.size = value;
        });
    folder_recon
        .add(guiController, "rec_charge_blob_opacity", 0, 1)
        .name("opacity")
        .onChange(function(value) {
            ev.material.opacity = value;
        });
    folder_recon.open();

    var folder_recon_cell = gui.addFolder("Recon (Cell Charge)");
    folder_recon_cell
        .add(guiController, "rec_charge_cell_size", 0, 6)
        .name("size")
        .step(1)
        .onChange(function(value) {
            ev_rec_charge_cell.material.size = value;
        });
    folder_recon_cell
        .add(guiController, "rec_charge_cell_opacity", 0, 1)
        .name("opacity")
        .onChange(function(value) {
            ev_rec_charge_cell.material.opacity = value;
        });
    folder_recon_cell.open();

    var folder_recon_simple = gui.addFolder("Recon (Simple)");
    folder_recon_simple
        .add(guiController, "rec_simple_size", 0, 6)
        .name("size")
        .step(1)
        .onChange(function(value) {
            ev_rec_simple.material.size = value;
        });
    folder_recon_simple
        .add(guiController, "rec_simple_opacity", 0, 1)
        .name("opacity")
        .onChange(function(value) {
            ev_rec_simple.material.opacity = value;
        });
    folder_recon_simple.open();

    var folder_truth = gui.addFolder("Truth");
    folder_truth
        .add(guiController, "truth_size", 0, 6)
        .name("size")
        .step(1)
        .onChange(function(value) {
            ev_truth.material.size = value;
        });
    folder_truth
        .add(guiController, "truth_opacity", 0, 1)
        .name("opacity")
        .onChange(function(value) {
            ev_truth.material.opacity = value;
        });
    folder_truth.open();

    var folder_slice = gui.addFolder("Slice");
    folder_slice
        .add(guiController.slice, "sliced_mode")
        .name("sliced mode")
        .onChange(function(value) {
            if (value) {
                drawAllSlicedParticles(guiController.slice.position-guiController.slice.width/2, guiController.slice.width);
            }
            else {
                drawAllSlicedParticles(-halfx, halfx*2);
            }
            // else {
            //     // restoreAllParticles();
            //     if(guiController.showCharge) {
            //         showAllCharge(true);
            //     }
            //     else {
            //         showAllCharge(false);
            //     }

            // }
        });
    folder_slice
        .add(guiController.slice, "opacity", 0, 1)
        .onChange(function(value) {
            slice.material.opacity = value;
        });
    folder_slice
        .add(guiController.slice, "width", 0.32, 0.32*100)
        .step(0.32)
        .onChange(function(value){
            slice.scale.x = value/0.32; // SCALE
        });

    folder_slice
        .add(guiController.slice, "position", -halfx+guiController.slice.width/2, halfx-guiController.slice.width/2)
        .onChange(function(value) {
            slice.position.x = value;
            updateStatusBar();
            if (guiController.slice.sliced_mode) {
                drawAllSlicedParticles(guiController.slice.position-guiController.slice.width/2, guiController.slice.width);
            }
        });
    folder_slice.open();

    var folder_camera = gui.addFolder("Camera");
    folder_camera.add(guiController, 'CenterToEvent').name('Center to Event');
    folder_camera.add(guiController, 'ResetCamera').name('Reset');
    folder_camera.add(guiController, "orthocamera")
       .name("Ortho Camera")
       .onChange(function(value) {
             if (value == true) {
                window.location.href = '#/' + id + '/orthocamera';
                location.reload();
             }
             else {
                window.location.href = '#/' + id;
                location.reload();
             }
     });
    folder_camera.open();

}
