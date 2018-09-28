#!/bin/bash
echo -e "Ready to pull the last modifications from the git branch master in your local repository !\n";
git pull origin master
pull_ok=$?
if [ $pull_ok -eq 0 ]; then
	echo -e "****** PULL STEP : OK \n";
fi
exit -1;
