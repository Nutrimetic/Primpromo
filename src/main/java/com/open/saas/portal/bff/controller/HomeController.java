package com.open.saas.portal.bff.controller;

import java.util.Optional;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class HomeController {
	
    @RequestMapping(path = {"/"}, method = RequestMethod.GET, produces = "text/plain")
    @ResponseBody
    String index(@RequestParam Optional<String> lang) throws Exception {
        return "";
    }
}
