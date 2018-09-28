#!/bin/bash
echo -e "Ready to push the last modifications from your local repository to the git branch master !\n";
read -p "Before starting this operation, please enter the commit description : " desc
git add .
add_ok=$?
if [ $add_ok -eq 0 ]; then
	echo -e "***** ADD STEP : OK \n";
	git commit -m "$desc"
	commit_ok=$?
	if [ $commit_ok -eq 0 ]; then
		echo -e "****** COMMIT STEP : OK \n";
		git pull origin master
		pull_ok=$?
		if [ $pull_ok -eq 0 ]; then
			echo -e "****** PULL STEP : OK \n";
			git push origin master
			push_ok=$?
			if [ $push_ok -eq 0 ]; then
				echo -e "****** PUSH STEP : OK \n";
			fi
		fi
	fi
fi
exit -1;
