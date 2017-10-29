<?php
    #Path for the error log
    $ERR_LOG_PATH = "../logs/err_log.log";
    $graph_name = $_POST['graphname'];
    $omega = $_POST['omega'];
    $nodes = json_decode($_POST['nodes']);
    $arcs = json_decode($_POST['arcs']);
    #Attempts to connect to the server
    $conn=@mysqli_connect("127.0.0.1","root");
    if (mysqli_connect_errno()) {
        error_log(date('Y-m-d H:i:sO')." ".mysqli_connect_error()."\r\n", 3, $ERR_LOG_PATH);
        die(json_encode(array('Error' => "Error:\n".mysqli_connect_error())));
    }
    #Attempts to connect to the database
	if(!mysqli_select_db($conn,"ohmulator")) {
        error_log(date('Y-m-d H:i:sO')." "."Couldn't select the database\r\n", 3, $ERR_LOG_PATH);
        die(json_encode(array('Error' => "Error:\nCouldn't select the database.")));
    }

    /*Saving must be an atomic transaction, so we encapsulate the code in a begin-commit-rollback structure*/
    mysqli_query($conn,"BEGIN;");
    /*Insertion in the circuit table.*/
    $query1="INSERT INTO Circuit (Name, Omega)
             VALUES ('$graph_name', $omega);";
    if(!$res1=mysqli_query($conn,$query1)) {
        error_log(date('Y-m-d H:i:sO')." ".mysqli_error($conn)."\r\n", 3, $ERR_LOG_PATH);
        mysqli_query($conn,"ROLLBACK;");
        die(json_encode(array('Error' => "Error:\nCouldn't perform the query.")));
    }
    /*Find the ID of the new circuit*/
    $query2="SELECT GraphID
             FROM Circuit
             WHERE Name='$graph_name';";
    if(!$res2=mysqli_query($conn,$query2)) {
        error_log(date('Y-m-d H:i:sO')." ".mysqli_error($conn)."\r\n", 3, $ERR_LOG_PATH);
        mysqli_query($conn,"ROLLBACK;");
        die(json_encode(array('Error' => "Error:\nCouldn't perform the query.")));
    }
    $row=mysqli_fetch_assoc($res2);
    $graphID=$row['GraphID'];
    /*Insertion of nodes*/
    foreach ($nodes as $node) {
        $query3="INSERT INTO Nodes (GraphID, LocalID, X, Y)
                 VALUES ($graphID, $node->id, $node->x, $node->y);";
        if(!$res3=mysqli_query($conn,$query3)) {
            error_log(date('Y-m-d H:i:sO')." ".mysqli_error($conn)."\r\n", 3, $ERR_LOG_PATH);
            mysqli_query($conn,"ROLLBACK;");
            die(json_encode(array('Error' => "Error:\nCouldn't perform the query.")));
        }
    }
    /*Insertion of arcs*/
    foreach ($arcs as $arc) {
        $V_AC_re = $arc->V_AC->re;
        $V_AC_im = $arc->V_AC->im;
        $query4="INSERT INTO Arc (GraphID, LocalID, Point1, Point2, X1, Y1, X2, Y2, Type, V_DC, V_AC_Re, V_AC_Im, Expression)
                 VALUES ($graphID, $arc->id, $arc->point1ID, $arc->point2ID, $arc->x1, $arc->y1, $arc->x2, $arc->y2, '$arc->T', $arc->V_DC, $V_AC_re, $V_AC_im, '$arc->expression' );";
        if(!$res4=mysqli_query($conn,$query4)) {
            error_log(date('Y-m-d H:i:sO')." ".mysqli_error($conn)."\r\n", 3, $ERR_LOG_PATH);
            mysqli_query($conn,"ROLLBACK;");
            die(json_encode(array('Error' => "Error:\nCouldn't perform the query.")));
        }
    }
    #Commit and print a success message
    mysqli_query($conn,"COMMIT;");
    print(json_encode(array('Status' => "Your circuit has been successfully uploaded!")));
    mysqli_close($conn);
?>