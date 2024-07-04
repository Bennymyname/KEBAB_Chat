import cv2
import numpy as np

# Load the reference image (lena.jpg)
reference_image_path = 'lena.jpg'
reference_image = cv2.imread(reference_image_path, cv2.IMREAD_GRAYSCALE)
if reference_image is None:
    raise ValueError("Reference image not found. Please check the file path.")

# Initialize SIFT detector
sift = cv2.SIFT_create()

# Detect SIFT features and compute descriptors for the reference image
keypoints_ref, descriptors_ref = sift.detectAndCompute(reference_image, None)

# Initialize video capture from the camera (0 for default camera)
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise ValueError("Camera not accessible. Please check your camera.")

# BFMatcher with default params
bf = cv2.BFMatcher()

while True:
    # Capture frame-by-frame from the camera
    ret, frame = cap.read()
    if not ret:
        break

    # Convert the frame to grayscale
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect SIFT features and compute descriptors for the video frame
    keypoints_frame, descriptors_frame = sift.detectAndCompute(gray_frame, None)

    # Match descriptors between the reference image and the current frame
    if descriptors_frame is not None:
        matches = bf.knnMatch(descriptors_ref, descriptors_frame, k=2)

        # Apply ratio test
        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)

        # Draw matches
        img_matches = cv2.drawMatches(reference_image, keypoints_ref, frame, keypoints_frame, good_matches, None, flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)

        # Display the resulting frame
        cv2.imshow('Matches', img_matches)

    # Press 'q' to exit the loop
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the capture and destroy all windows
cap.release()
cv2.destroyAllWindows()
